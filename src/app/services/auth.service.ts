import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, signOut, signInWithCustomToken } from '@angular/fire/auth';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import detectEthereumProvider from '@metamask/detect-provider';

interface NonceResponse {
  status: boolean;
  data: any;
  error: any;
}

interface VerifyResponse {
  status: boolean;
  data: any;
  error: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private auth: Auth) {}

  public signOut() {
    return signOut(this.auth);
  }

  public signInWithMetaMask() {
    let ethereum: any;

    return from(detectEthereumProvider()).pipe(
      // Step 1: Request (limited) access to users ethereum account
      switchMap(async (provider) => {
        if (!provider) {
          throw new Error('Please install MetaMask');
        }

        ethereum = provider;

        return await ethereum.request({ method: 'eth_requestAccounts' });
      }),
      // Step 2: Retrieve the current nonce for the requested address
      switchMap(() => {
        console.log('ethereum:', ethereum.selectedAddress);
          return this.http.get<NonceResponse>(
            `https://l73zoabqa4.execute-api.us-east-1.amazonaws.com/dev/user/nonce/${ethereum.selectedAddress}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': 'xxxxxxx',
              }
            }
          );
      }

      ),
      // Step 3: Get the user to sign the nonce with their private key
      switchMap(
        async (response) => {
          console.log('nonce: ', response.data.nonce);
          console.log('`0x${this.toHex(response.data.nonce)}`: ', `0x${this.toHex(response.data.nonce)}`);
          const msg = `0x${Buffer.from(response.data.nonce, 'utf8').toString('hex')}`;
          return await ethereum.request({
            method: 'personal_sign',
            params: [
              msg,
              ethereum.selectedAddress,
            ],
          });
        }

      ),
      // Step 4: If the signature is valid, retrieve a custom auth token
      switchMap((sig) => {
        console.log('verify body:', { address: ethereum.selectedAddress, signature: sig });
          return this.http.post<VerifyResponse>(
            'https://l73zoabqa4.execute-api.us-east-1.amazonaws.com/dev/user/web3',
            { address: ethereum.selectedAddress, signature: sig },{
              headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': 'xxxxxxx',
              }
            }
          );
      }
      ),
      // Step 5: Use the auth token to auth and request the Dynamic Reveal
      switchMap(
        async (response) =>
        {
          console.log('Dynamic Reveal:', response);
          return this.http.post<VerifyResponse>(
            'https://l73zoabqa4.execute-api.us-east-1.amazonaws.com/dev/adapter/reveal',
            { contractAddress: 'xxxxxx', blockchain: 'xxxx', tokenId: 0 },{
              headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': 'xxxxxxx',
                'Authorization': response.data.token
              }
            }
          );
        }
      )
    );
  }

  private toHex(stringToConvert: string) {
    return stringToConvert
      .split('')
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }
}
