import app from "./app.js";

app.listen(5000, (err) => {
  if (err) console.error(err)
  console.log("Listening")
})
