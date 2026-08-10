import bcrypt from "bcrypt";
import { Role } from "../src/generated/prisma/enums.js";
import { signAccessToken } from '../src/utils/jwt.js';
import { prisma } from '../src/lib/prisma.js';



const BASE_URL = "http://localhost:3000/api";
const NUM_USERS = 20;
const PRODUCT_STOCK = 10;

interface TestUser {
  id: string;
  email: string;
  token: string;
}


async function loginAdmin() : Promise<string>{
    const res = await fetch(`${BASE_URL}/auth/login` , {
        method: "POST",
        headers: {
            'Content-Type' : "application/json",
        },
        body : JSON.stringify({
            email : "admin@example.com",
            password : "password123",
        })
    }) 

    const data = await res.json();
    if(!data.success){
        throw new Error(`Admin login failed: ${JSON.stringify(data)}`);
    }
      return data.data.accessToken;
}

async function createTestProduct(adminToken: string): Promise<string> {
  console.log("adminToken :", adminToken);
  const res = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: `Load Test Product ${Date.now()}`,
      description: "abcdefg",
      price: 100,
      stock: PRODUCT_STOCK,
    }),
  });

  const data = await res.json();
  return data.data.id;
}

async function createTestUser() : Promise<TestUser[]>{
    const passwordHash = await bcrypt.hash('Testuser123' , 10);
    const users: TestUser[] = [];

    for(let i = 0; i<NUM_USERS; i++){
       const email = `test_user_${Date.now()}_${i}@test.com`;

       const user = await prisma.user.create({
        data : {
            email,
            passwordHash,
            role : Role.USER
        }
       })

       const token = signAccessToken({ id: user.id, email: user.email, role: user.role });

      users.push({id : user.id , email , token});
    }

    return users;
}

async function addToCart(token: string, productId: string): Promise<void> {
  await fetch(`${BASE_URL}/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
}

async function checkout(
  token: string,
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log('\n=== Checkout Load Test ===');
  console.log(`Users: ${NUM_USERS} | Stock: ${PRODUCT_STOCK}\n`);

  console.log('1. Admin...');
  const adminToken = await loginAdmin();

  console.log('2. Product...');
  const productId = await createTestProduct(adminToken);
  console.log(`Product: ${productId}`);

  console.log(`3. Users: ${NUM_USERS}...`);
  const users = await createTestUser();
  console.log(`${users.length} users created`);

  console.log('4. Adding to carts...');
  for (const user of users) {
    await addToCart(user.token, productId);
  }

  console.log('5. Checkout...');
  const start = Date.now();

  const results = await Promise.all(
    users.map((user) => checkout(user.token))
  );

  const duration = Date.now() - start;

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log('\n=== Results ===');
  console.log(`Time: ${duration}ms`);
  console.log(`Success: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Expected: ${Math.min(NUM_USERS, PRODUCT_STOCK)}`);

  if (succeeded > PRODUCT_STOCK) {
    console.log(`Oversold: ${succeeded}`);
  } else {
    console.log('No overselling');
  }

  const failure = results.find((r) => !r.ok);
  if (failure) {
    console.log('Sample failure:', failure.body);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  const logs = await prisma.inventoryLog.aggregate({
    where: { productId },
    _sum: { quantityDelta: true },
  });

  const expectedStock =
    PRODUCT_STOCK + (logs._sum.quantityDelta ?? 0);

  console.log('\n=== DB ===');
  console.log(`Initial: ${PRODUCT_STOCK}`);
  console.log(`Delta: ${logs._sum.quantityDelta}`);
  console.log(`Expected: ${expectedStock}`);
  console.log(`Actual: ${product?.stock}`);

  console.log(
    expectedStock === product?.stock
      ? 'Stock looks good'
      : 'Stock mismatch'
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Load test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});


