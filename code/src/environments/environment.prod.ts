export const environment = {
  production: true,

  host: window["env"]["host"] || "",
  socket_host: window["env"]["socket_host"] || "",
  keycloakURL: window["env"]["keycloakURL"] || "",
  apiUrl: window["env"]["apiUrl"] || "",
  realm: window["env"]["realm"] || "coevolution",
  clientId: window["env"]["clientId"] || "coevolution",
  srme: window["env"]["srme"] || 'http://147.27.60.12:3000/dashboard.html'

};
