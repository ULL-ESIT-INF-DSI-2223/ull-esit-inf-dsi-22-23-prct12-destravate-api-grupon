import { connect } from "mongoose";

const uri = "mongodb+srv://destravate:ttt1234@clusterdestravate.ujpp2el.mongodb.net/test";

try {
  await connect(uri);

  console.log("Conectado al servidor MongoDB");
} catch (error) {
  console.log("No se pudo conectar al servidor MongoDB");
  console.log(error);
}
