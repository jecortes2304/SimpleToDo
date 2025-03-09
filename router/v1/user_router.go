package v1

import (
	"fmt"
	"net/http"
)

type UserController struct{}

func (*UserController) getUserHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.PathValue("userId") // 🚀 Obtiene {userId} automáticamente
	fmt.Fprintf(w, "Fetching user ID: %s", userId)
}

func (*UserController) createUserHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.PathValue("userId")
	fmt.Fprintf(w, "Creating user ID: %s", userId)
}

func (*UserController) updateUserHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.PathValue("userId")
	fmt.Fprintf(w, "Updating user ID: %s", userId)
}

func (*UserController) deleteUserHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.PathValue("userId")
	fmt.Fprintf(w, "Deleting user ID: %s", userId)
}

func UserRouters(mux *http.ServeMux) {
	userController := new(UserController)

	mux.HandleFunc("GET /users/{userId}", userController.getUserHandler)
	mux.HandleFunc("POST /users/{userId}", userController.createUserHandler)
	mux.HandleFunc("PUT /users/{userId}", userController.updateUserHandler)
	mux.HandleFunc("DELETE /users/{userId}", userController.deleteUserHandler)
}
