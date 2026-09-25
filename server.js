const http = require("http");
const fs = require("fs");
const url = require("url");
const db = require("./db.json");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/users") {
    fs.readFile("db.json", (error, data) => {
      if (error) {
        throw error;
      }
      const db = JSON.parse(data);

      res.writeHead(200, { "content-type": "application/json" });
      res.write(JSON.stringify(db.users));
      res.end();
    });
  } else if (req.method === "GET" && req.url === "/api/books") {
    fs.readFile("db.json", (error, data) => {
      if (error) {
        throw error;
      }

      const db = JSON.parse(data);
      res.writeHead(200, { "content-type": "application/json" });
      res.write(JSON.stringify(db.books));
      res.end();
    });
  } else if (req.method === "DELETE" && req.url.startsWith("/api/books")) {
    const parsedURL = url.parse(req.url, true);
    const bookID = parsedURL.query.id;

    const newBooks = db.books.filter((book) => book.id != bookID);
    const isBookID = db.books.some((book) => book.id == bookID);

    if (isBookID) {
      fs.writeFile(
        "db.json",
        JSON.stringify({ ...db, books: newBooks }),
        (error) => {
          if (error) {
            throw error;
          }

          res.writeHead(200, { "content-type": "application/json" });
          res.write(JSON.stringify({ message: "book remove successfully 📕" }));
          res.end();
        },
      );
    } else {
      res.end(JSON.stringify({ message: "no such book ❌" }));
    }
  } else if (req.method === "POST" && req.url === "/api/books") {
    let book = "";
    req.on("data", (data) => {
      book = book + data.toString();
    });

    req.on("end", () => {
      const newBook = { id: crypto.randomUUID(), ...JSON.parse(book), free: 1 };
      db.books.push(newBook);
      fs.writeFile("db.json", JSON.stringify(db), (error) => {
        if (error) {
          throw error;
        }

        res.writeHead(201, { "content-type": "application/json" });
        res.write(
          JSON.stringify({ message: "new book added successfully 📗" }),
        );
        res.end();
      });
    });
  } else if (req.method === "PUT" && req.url.startsWith("/api/books/back")) {
    const parsedURL = url.parse(req.url, true);
    const bookID = parsedURL.query.id;
    db.books.forEach((book) => {
      if (book.id === bookID) {
        book.free = 1;
      }
    });
    fs.writeFile("db.json", JSON.stringify(db), (error) => {
      if (error) {
        throw error;
      }

      res.writeHead(200, { "content-type": "application/json" });
      res.write(JSON.stringify({ message: "book back successfully 📚✅" }));
      res.end();
    });
  } else if (req.method === "PUT" && req.url.startsWith("/api/books")) {
    const parsedURL = url.parse(req.url, true);
    const bookID = parsedURL.query.id;

    const isBookID = db.books.some((book) => book.id == bookID);
    if (isBookID) {
      let bookUpdatedInfo = "";
      req.on("data", (data) => {
        bookUpdatedInfo = bookUpdatedInfo + data.toString();
      });
      req.on("end", () => {
        const reqBody = JSON.parse(bookUpdatedInfo);
        db.books.forEach((book) => {
          if (book.id === bookID) {
            book.title = reqBody.title;
            book.author = reqBody.author;
            book.price = reqBody.price;
          }
        });

        fs.writeFile("db.json", JSON.stringify(db), (error) => {
          if (error) {
            throw error;
          }

          res.writeHead(200, { "content-type": "application/json" });
          res.write(
            JSON.stringify({ message: "book updated successfully 📘" }),
          );
          res.end();
        });
      });
    } else {
      res.writeHead(402, { "content-type": "application/json" });
      res.write(JSON.stringify({ message: "no such book" }));
      res.end();
    }
  } else if (req.method === "POST" && req.url === "/api/users") {
    let user = "";
    req.on("data", (data) => {
      user = user + data.toString();
    });
    req.on("end", () => {
      const { username, name, email } = JSON.parse(user);
      const isUserExist = db.users.find(
        (user) => user.username === username || user.email === email,
      );
      if (username === "" || name === "" || email === "") {
        res.writeHead(422, { "content-type": "application/json" });
        res.write(JSON.stringify({ message: "invalid information" }));
        res.end();
      } else if (isUserExist) {
        res.writeHead(409, { "content-type": "application/json" });
        res.write(
          JSON.stringify({ message: "username or email alreadi exist" }),
        );
        res.end();
      } else {
        const newUser = {
          id: crypto.randomUUID(),
          username,
          name,
          email,
          crime: 0,
          role: "USER",
        };
        db.users.push(newUser);
        fs.writeFile("db.json", JSON.stringify(db), (error) => {
          if (error) {
            throw error;
          }

          res.writeHead(201, { "content-type": "application/json" });
          res.write(
            JSON.stringify({ message: "user added successfully 👤✅" }),
          );
          res.end();
        });
      }
    });
  } else if (req.method === "PUT" && req.url.startsWith("/api/users/upgrade")) {
    const parsedURL = url.parse(req.url, true);
    const userID = parsedURL.query.id;
    const isUser = db.users.some((user) => user.id === userID);
    if (isUser) {
      db.users.forEach((user) => {
        if (user.id === userID) {
          user.role = "ADMIN";
        }
      });
      fs.writeFile("db.json", JSON.stringify(db), (error) => {
        if (error) {
          throw error;
        }

        res.writeHead(200, { "content-type": "application/json" });
        res.write(
          JSON.stringify({ message: "user upgrade successfully 👑✅" }),
        );
        res.end();
      });
    } else {
      res.writeHead(422, { "content-type": "application/json" });
      res.write(JSON.stringify({ message: "no user exist" }));
      res.end();
    }
  } else if (req.method === "PUT" && req.url.startsWith("/api/users")) {
    const parsedURL = url.parse(req.url, true);
    const userID = parsedURL.query.id;

    const isUser = db.users.some((user) => user.id === userID);
    if (isUser) {
      let user = "";
      req.on("data", (data) => {
        user = user + data.toString();
      });
      req.on("end", () => {
        const { crime } = JSON.parse(user);
        db.users.forEach((user) => {
          if (user.id === userID) {
            user.crime = crime;
          }
        });
        fs.writeFile("db.json", JSON.stringify(db), (error) => {
          if (error) {
            throw error;
          }

          res.writeHead(200, { "content-type": "application/json" });
          res.write(
            JSON.stringify({ message: "user crime updated successfully 💸✅" }),
          );
          res.end();
        });
      });
    } else {
      res.writeHead(402, { "content-type": "application/json" });
      res.write(JSON.stringify({ message: "user not found" }));
      res.end();
    }
  } else if (req.method === "POST" && req.url === "/api/users/login") {
    let reqBody = "";
    req.on("data", (data) => {
      reqBody = reqBody + data.toString();
    });

    req.on("end", () => {
      const { email, username } = JSON.parse(reqBody);
      const user = db.users.find(
        (user) => user.email === email && user.username === username,
      );

      if (user) {
        res.writeHead(200, { "content-type": "application/json" });
        res.write(
          JSON.stringify({ username: user.username, email: user.email }),
        );
        res.end();
      } else {
        res.writeHead(401, { "content-type": "application/json" });
        res.write(JSON.stringify({ message: "access denaid" }));
        res.end();
      }
    });
  } else if (req.method === "POST" && req.url === "/api/books/rent") {
    let reqBody = "";
    req.on("data", (data) => {
      reqBody = reqBody + data.toString();
    });

    req.on("end", () => {
      const { bookID, userID } = JSON.parse(reqBody);

      const isBookFree = db.books.some((book) => book.id === bookID);
      if (isBookFree) {
        db.books.forEach((book) => {
          if (book.id === bookID) {
            book.free = 0;
          }
        });
        const newRent = {
          id: crypto.randomUUID(),
          userID: userID,
          bookID: bookID,
        };

        db.rents.push(newRent);
        fs.writeFile("db.json", JSON.stringify(db), (error) => {
          if (error) {
            throw error;
          }

          res.writeHead(201, { "content-type": "application/json" });
          res.write(
            JSON.stringify({ message: "book reserved successfully 🔖✅" }),
          );
          res.end();
        });
      } else {
        res.writeHead(402, { "content-type": "application/json" });
        res.write(JSON.stringify({ message: "book is not free" }));
        res.end();
      }
    });
  }
});

server.listen(19000, () => {
  console.log("server 🟢");
});
