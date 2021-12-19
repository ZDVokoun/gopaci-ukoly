package main

import (
	"fmt"
    "time"
    "net/http"
    "github.com/golang-jwt/jwt"
	"crypto/x509"
	"encoding/pem"
	"errors"
)

var secretJWTKey string

func generateJWT(userID, username string) (http.Cookie, error) {
    secretKeyPem := "-----BEGIN RSA PRIVATE KEY-----\n" + secretJWTKey + "\n-----END RSA PRIVATE KEY-----"
	secretKeyBlock, _ := pem.Decode([]byte(secretKeyPem))
	if secretKeyBlock == nil {
		return http.Cookie{}, errors.New("failed to parse PEM block")
	}
	mySigningKey, err := x509.ParsePKCS1PrivateKey(secretKeyBlock.Bytes)
	if err != nil {
		return http.Cookie{}, err
	}
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
