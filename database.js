import mongoose from "mongoose";


class Database {

    constructor(){
        this.connect();
    }
    connect() {
        mongoose
            .connect("YourDbURL")
            .then(() => {
                console.log("database connection successfull");
            })
            .catch((error) => {
                console.log("database connection error" + error);
            });
    }
}

export default  new Database();