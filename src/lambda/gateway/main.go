package main

import (
    "flag"
    "fmt"
    "log"
    "net/http"
    "context"
    "time"

    "github.com/apex/gateway"
    "go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
    "github.com/golang-jwt/jwt"
    // "go.mongodb.org/mongo-driver/bson"
)

func createClient() (*mongo.Client, error) {
    uri := "mongodb+srv://spravce:***REMOVED***@cluster0.u4fbx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
    if err != nil {
        return nil, err
    }
    err = client.Ping(context.TODO(), nil)
    if err != nil {
        return nil, err
    }
    return client, err
}

func databaseWorking(w http.ResponseWriter, r *http.Request) {
    _ , err := createClient()
    if err != nil {
        fmt.Fprintf(w, "No connection")
        return
    }
    fmt.Fprintf(w, "Success")
}

func generateJWT(userID, username string) (string, error) {
    secretKey :=
        "-----BEGIN RSA PRIVATE KEY-----\n" +
        "" +
        "\n-----END RSA PRIVATE KEY-----"
	var mySigningKey = []byte(secretkey)
	token := jwt.New(jwt.SigningMethodRS256)
	claims := token.Claims.(jwt.MapClaims)

	claims["userID"] = userID
	claims["username"] = username
	claims["exp"] = time.Now().Add(time.Day * 14).Unix()

	tokenString, err := token.SignedString(mySigningKey)

	if err != nil {
		fmt.Errorf("Something Went Wrong: %s", err.Error())
		return "", err
	}
	return tokenString, nil
}

func main() {
    port := flag.Int("port", -1, "specify a port to use http rather than AWS Lambda")
    flag.Parse()
    listener := gateway.ListenAndServe
    portStr := "n/a"
    if *port != -1 {
        portStr = fmt.Sprintf(":%d", *port)
        listener = http.ListenAndServe
        http.Handle("/", http.FileServer(http.Dir("./build")))
        fmt.Println("Running")
    }

    http.HandleFunc("/api/helloworld", func(w http.ResponseWriter, r *http.Request){
		fmt.Fprintf(w, "Hello World!")
	})
    http.HandleFunc("/api/working", databaseWorking)
    log.Fatal(listener(portStr, nil))
}
