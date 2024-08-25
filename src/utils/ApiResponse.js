class ApiResponse {
    constructor(statusCose, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCose < 400;
    }
}
