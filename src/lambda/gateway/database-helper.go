package main

import (
	"context"
    "go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var mongoDBPassword string

func createClient() (*mongo.Client, error) {
    uri := "mongodb+srv://spravce:" + mongoDBPassword + "@cluster0.u4fbx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
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
