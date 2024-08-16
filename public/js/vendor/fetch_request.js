export const fetchRequest=async function(set){
    /*
    {
        method:'GET/POST/PUT/DELETE',
        url:`http://su_ip:80/ruta`,
        data: Para JSON- JSON.stringyfy(data)   Para formulario - new URLSearchParams(fd).toString(),
        credentials:'include',
        contentType:Para JSON - 'application/json' Para formulario- 'application/x-www-form-urlencoded',
        async success(response){  //en caso de que la peticion se hizo correctamente
            console.log(`Estado de respuesta: ${response.status}`);
            if(response.ok){    //200-299
                //Para tranformar a JSON
                const data=response.json();
                //Para html
                const $html=response.text();
                

            }
            else{   //400-499    errores
            
            }
        }.
        async error(err){ //500-599   errores de servidor
            console.log(error de servidor);
            console.error(err);
        }
    }
    */
    const {method,url,data,credentials,contentType,success,error}=set;
    //console.log("informacion a enviar en la peticion Fetch");
    //console.log(method,url,data,credentials,contentType);
    const headers = {};

    // Solo establecer el content-type si no es FormData
    if (!(data instanceof FormData)) {
        headers['Content-Type'] = contentType;
    }
    const options={
        method:method,
        headers,
        body:data,
        credentials:credentials,
        cache:'no-cache'
    }
    try {
        const response= await fetch(url,options);
        success(response);   //manejamos el evento completo con el metodo succes
        return true;
    } catch (err) {
        console.error('Ocurrio un problema con tu peticion fetch',err);
        error(err);
        return false;
    }
}