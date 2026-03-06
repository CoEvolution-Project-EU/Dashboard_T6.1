FROM node:18-alpine As builder

WORKDIR /usr/src/app/fvt

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build -- --base-href='/fvt/' --deploy-url='/fvt/'

FROM nginx:alpine

COPY --from=builder /usr/src/app/fvt/dist /usr/share/nginx/html/fvt

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/fvt/assets/env.template.js > /usr/share/nginx/html/fvt/assets/env.js && exec nginx -g 'daemon off;'"]
