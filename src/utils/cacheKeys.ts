
export const cacheKeys = {
    productById : (id: string) => `product:${id}`,

    productsList : (page : number, limit : number, isActive : boolean | undefined) => 
        `products:liist:page=${page}:limit=${limit}:active:${isActive ?? 'all'}`,

    productListPattern : () => `products:list:*`,    
}