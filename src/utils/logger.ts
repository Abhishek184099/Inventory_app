const logger = {
    info(message : string , data? :unknown){
        console.log(`[INFO] : ${message}` ,  data ?? "");
    },
    error(message : string,data? :unknown){
        console.log(`[ERR] : ${message}` , data??"")
    }
}

export default logger;

