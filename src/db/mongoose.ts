import { connect } from "mongoose";

try {
  await connect(process.env.MONGODB_URL!);
  console.log("Conectado al servidor MongoDB");
} catch (error) {
  console.log("No se pudo conectar al servidor MongoDB");
}
