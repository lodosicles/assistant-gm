Auth with JWT to enable correct header for ollama api.

Hi! We're using JWT to authenticate /ollama/api route now, You'll have to request the token from the backend before you access your ollama route like such:

export const userSignIn = async (email: string, password: string) => {
	let error = null;

	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signin`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email: email,
			password: password
		})
	})
		.then(async (res) => {
			if (!res.ok) throw await res.json();
			return res.json();
		})
		.catch((err) => {
			console.log(err);

			error = err.detail;
			return null;
		});

	if (error) {
		throw error;
	}

	return res;
};

If you make request to the route /auths/signin above, it will return the following response:

return {
            "token": token,
            "token_type": "Bearer",
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_image_url": user.profile_image_url,
        }

Which then you can use the token value to authenticate yourself with the authentication header in your request, Thanks!
5 replies 1 new
@StreamlinedStartup
StreamlinedStartup
Jan 4, 2024
Author

I may be a bit confused as I don't have a WEBUI_BASE_URL (docker-compose below).

my.site.com/api/auths/signin produces 405 Method Not Allowed and my.site.com/ollama/api/auths/signin produces 401 Unauthorized.

Both are post requests with:

{
  "email": "name@email.com",
  "password": "mydopepassword"
}

version: '3.8'

services:
  ollama-webui:
    build:
      context: .
      args:
        OLLAMA_API_BASE_URL: '/ollama/api'
      dockerfile: Dockerfile
    image: ghcr.io/ollama-webui/ollama-webui:main
    container_name: ollama-webui
    volumes:
      - ./data:/app/backend/data
    depends_on:
      - ollama
    ports:
      - 5932:8080
    environment:
      - "OLLAMA_API_BASE_URL=http://192.168.68.84:11434/api"
    extra_hosts:
      - host.docker.internal:host-gateway
    restart: unless-stopped

volumes:
  ollama: {}
  ollama-webui: {}

Forgive my potential ignorance here as I'm not much of a developer, and thanks for the help!
@tjbck
tjbck
Jan 5, 2024
Maintainer

The url should be my.site.com/api/v1/auths/signin!
Answer selected by StreamlinedStartup
@StreamlinedStartup
StreamlinedStartup
Jan 5, 2024
Author

That did it, thanks! I didn't totally miss this in documentation, did I?
@kyletaylored
kyletaylored
Jun 6, 2024

How would this work if you're working locally and setting WEBUI_AUTH=FALSE to disable login requirement?
@justinh-rahb
justinh-rahb
Jun 7, 2024
Collaborator

    How would this work if you're working locally and setting WEBUI_AUTH=FALSE to disable login requirement?

You can still create API keys in Settings > Account
