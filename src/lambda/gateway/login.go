package main

import (
	"fmt"
	"net/http"
    "context"
	"encoding/json"

	"golang.org/x/crypto/bcrypt"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type UserCredentials struct {
	Username string
	Password string
}

type UserDocument struct {
	_id primitive.ObjectID
	Username string
	HashedPassword string
}

func errorResponse(w http.ResponseWriter, message string, httpStatusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatusCode)
	returnMessage := fmt.Sprintf("%d %s - %s", httpStatusCode, http.StatusText(httpStatusCode), message)
	fmt.Println(returnMessage)
	resp := make(map[string]string)
	resp["message"] = returnMessage
	jsonResp, _ := json.Marshal(resp)
	w.Write(jsonResp)
}

func login(w http.ResponseWriter, r *http.Request) {
	dbClient, err := createClient()
	if err != nil {
		errorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer func() {
		if err = dbClient.Disconnect(context.TODO()); err != nil {
			errorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}()
	var credentials UserCredentials
	jsonDecoder := json.NewDecoder(r.Body)
	jsonDecoder.DisallowUnknownFields()
	err = jsonDecoder.Decode(&credentials)
	if err != nil {
		errorResponse(w, "Bad Request", http.StatusBadRequest)
		return
	}
	users := dbClient.Database("gopaci-ukoly").Collection("users")
	var existingUserBSON bson.D
	if err = users.FindOne(context.TODO(), bson.D{}).Decode(&existingUserBSON); err != nil {
		errorResponse(w, "Invalid password or username", http.StatusUnauthorized)
		return
	}
	var existingUser UserDocument
	marshaledExistingUser, _ := bson.Marshal(existingUserBSON)
	if err = bson.Unmarshal(marshaledExistingUser, &existingUser); err != nil {
		errorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(existingUser.HashedPassword), []byte(credentials.Password))
	if err != nil {
		errorResponse(w, "Invalid password or username", http.StatusUnauthorized)
		return
	}
	jwtCookie, err := generateJWT(existingUser._id.String(), credentials.Username)
	if err != nil {
		errorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	http.SetCookie(w, &jwtCookie)
	// w.WriteHeader(http.StatusOK)
	resp := make(map[string]string)
	resp["id"] = existingUser._id.String()
	resp["username"] = credentials.Username
	jsonResp, _ := json.Marshal(resp)
	w.Write(jsonResp)
}
