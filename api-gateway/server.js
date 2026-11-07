import "dotenv/config";
import app from "./src/app.js";


app.listen(8000, () => {
  console.log(`API Gateway running on port 8000`);
});