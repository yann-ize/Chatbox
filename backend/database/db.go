package database

import (
	"database/sql"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDB() {
	var err error
	dsn := "root:@tcp(127.0.0.1:3306)/chatbox"
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Unable to connect to the database:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Unable to reach the database:", err)
	}
	log.Println("Connected to the database successfully!")
}
