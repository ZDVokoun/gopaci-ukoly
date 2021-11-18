package main

import (
	"fmt"
    "time"
    "net/http"
    "github.com/golang-jwt/jwt"
)

var secretJWTKey string

func generateJWT(userID, username string) (http.Cookie, error) {
    secretKey := "-----BEGIN RSA PRIVATE KEY-----\n" + secretJWTKey + "\n-----END RSA PRIVATE KEY-----"
	var mySigningKey = []byte(secretKey)
	token := jwt.New(jwt.SigningMethodRS256)
	claims := token.Claims.(jwt.MapClaims)

	claims["userID"] = userID
	claims["username"] = username
	claims["exp"] = time.Now().Add(time.Hour * 24 * 14).Unix()

	tokenString, err := token.SignedString(mySigningKey)

	jwtCookie := http.Cookie{
		Name:"jwt",
		Value: tokenString,
		Path: "/",
		HttpOnly: true,
		Secure: true,
	}
	if err != nil {
		fmt.Errorf("Something Went Wrong: %s", err.Error())
		return http.Cookie{}, err
	}
	return jwtCookie, nil
}

func clearCookie() http.Cookie {
	return http.Cookie{
		Name:"jwt",
		Value:"deleted",
		RawExpires: "Thu, 01 Jan 1970 00:00:00 GMT",
	}
}
