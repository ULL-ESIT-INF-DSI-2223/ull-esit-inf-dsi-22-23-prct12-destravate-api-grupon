import { connect } from "mongoose";

const uri = "mongodb://127.0.0.1:27017/destravate-api";

try {
  await connect(uri);
  console.log("Conectado al servidor MongoDB");
} catch (error) {
  console.log("No se pudo conectar al servidor MongoDB");
  console.log(error);
}
