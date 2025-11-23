const bcrypt = require("bcryptjs");
console.log(bcrypt.hashSync("admin123", 10));
console.log(
  bcrypt.compareSync(
    "admin123",
    "$2b$10$TAu3Za6pqqLy1oAK8aymz.OWIfeVu9te4ZCwCPilzHxjXdz36oPVy"
  )
);
