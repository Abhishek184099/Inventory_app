import { UserPayloadContract } from "../contracts/user.contract.ts";

declare global{
    namespace Express{
        interface Request{
            user? : UserPayloadContract,
            validated? : {
                body? : unknown,
                query?: unknown;
                params?: unknown;
            }
        }
    }
}