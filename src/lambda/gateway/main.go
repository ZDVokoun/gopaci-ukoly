package main

import (
    "flag"
    "fmt"
    "log"
    "net/http"
    "context"

	"github.com/awslabs/aws-lambda-go-api-proxy/handlerfunc"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

var handlerfuncLambda *handlerfunc.HandlerFuncAdapter

func databaseWorking(w http.ResponseWriter, r *http.Request) {
    _ , err := createClient()
    if err != nil {
        fmt.Fprintf(w, "No connection")
        return
    }
    fmt.Fprintf(w, "Success")
}



func rootHandler(w http.ResponseWriter, r *http.Request) {
	switch url := r.URL.Path; url {
	case "/api/helloworld", "/.netlify/functions/gateway/api/helloworld":
		func(w http.ResponseWriter, r *http.Request){
			fmt.Fprintf(w, "Hello World!")
		}(w,r)
	case "/api/working", "/.netlify/functions/gateway/api/working":
		databaseWorking(w,r)
	case "/api/login", "/.netlify/functions/gateway/api/login":
		login(w,r)
	default:
		fmt.Println("Error 404 " + url)
		fmt.Fprintf(w, "404 Not Found")
	}

}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if handlerfuncLambda == nil {
		handlerfuncLambda = handlerfunc.New(http.HandlerFunc(rootHandler));
	}
	return handlerfuncLambda.ProxyWithContext(ctx, req)
}

func main() {
    port := flag.Int("port", -1, "specify a port to use http rather than AWS Lambda")
    flag.Parse()
    if *port != -1 {
        portStr := fmt.Sprintf(":%d", *port)
		http.HandleFunc("/", rootHandler)
        // http.Handle("/", http.FileServer(http.Dir("./build")))
        fmt.Println("Running")
		log.Fatal(http.ListenAndServe(portStr, nil))
    } else {
		lambda.Start(Handler)
	}
}
