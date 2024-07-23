export const dinamicHTML=async function(set){
    /*
    {
        method:'',
        url:'',
        contentType:'',
        succes(response){

        },
        error(){
        
        }
    }
    
    */
    const {method,url,contentType,success,error}=set;
    const options={
        method:method,
        headers:{
            'Content-Type':contentType
        },
        cache:'no-cache'
    }
    try {
        const response= await fetch(url,options);
        success(response);   //manejamos el evento completo con el metodo succes que se le pas
        //estado de respuesta  
    } catch (err) {
        console.error('Ocurrio un problema con tu peticion fetch',err);
        error(err);
    }
    

}