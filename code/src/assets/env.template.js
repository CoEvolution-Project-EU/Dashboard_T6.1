(function (window) {
    window.env = window.env || {};

    // Environment variables
    window["env"]["host"] = "${SERV_HOST}";
    window["env"]["socket_host"] = "${SOCKET_HOST}";
    window["env"]["keycloakURL"] = "${KEYCLOAK_URL}";
    window["env"]["apiUrl"] = "${API_URL}";


})(this);

