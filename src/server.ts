    import "dotenv/config";

    import express, { Application } from "express";
    import { Request , Response } from "express";
    import authRoutes from "./routes/auth.route.js"
    import userRoutes from './routes/user.route.js';
    import productRoutes from './routes/product.route.js';
    import cartRoutes from './routes/cart.route.js';
    import orderRoutes from './routes/order.route.js';

    import { errorHandler } from "./middlewares/errorHandler.middleware.js";


    const app : Application = express();


    app.use(express.json());

    app.use('/health' , async (req : Request, res : Response) => await res.status(200).json("healthy"))
    app.use('/api/auth' ,authRoutes)
    app.use('/api/users', userRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/orders', orderRoutes);

    app.use(errorHandler);

    app.listen(process.env.PORT ,() => {
        console.log(`server is running at ${process.env.PORT}`);
    })

