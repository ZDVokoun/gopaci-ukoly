export function sendRequest(endpoint, body) {
    return new Promise(async (resolve, reject) => {
        const requestOptions = {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        };
        if (body) {
            requestOptions.method = "POST";
            requestOptions.headers["Content-Type"] = "application/json";
            requestOptions.body = JSON.stringify(body);
        }
        const response = await fetch(
            `/.netlify/functions/${endpoint}`,
            requestOptions
        );
        const responseBody = await response.json();
        if (response.ok) {
            resolve(responseBody);
        } else {
            reject(responseBody.msg);
        }
    });
}

export function debounce (func) {
    let timer;
    return function (...args) {
      const context = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        func.apply(context, args);
      }, 500);
    };
  };
