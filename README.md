# acs-dynamic-reveal-demo


All the workflow needed to implement is at:
    - src/app/services/auth.service
    
The steps are:
  ##### Step 1: Request (limited) access to users ethereum account
  ##### Step 2: Retrieve the current nonce for the requested address
  ##### Step 3: Get the user to sign the nonce with their private key
  ##### Step 4: If the signature is valid, retrieve a custom auth token
  ##### Step 5: Use the auth token to auth and request the Dynamic Reveal
  
To start the project locally:
    `npm run start`
