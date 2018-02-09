**CoinhiveAPI**
=

Unofficial module for **[Coinhive API](https://coinhive.com/documentation/http-api)**


##Constructor

```js
    /**
     *
     * @param secret_key Coinhive Secret Key
     */
    constructor (secret_key)
```

##token/verify
```js
    /**
     * @description The method to verify that a token from a CoinHive.Token miner has reached a number of hashes
     * @param token The name of the token you want to verify
     * @param hashes The number of hashes this token must have reached in order to be vali
     * @param callback The callback
     */
    verify(token, hashes, callback)
```

##user/balance
```js
    /**
     * @description The method to get the total number of hashes, the withdrawn hashes and the current balance for a user name
     * @param name The user's name, analogous to the name specified for the CoinHive.User miner
     * @param callback The callback
     */
    balance(name, callback)
```

##user/withdraw
```js
    /**
     * @description The method to withdraw a number of hashes for a user name
     * @param name The user's name, analogous to the name specified for the CoinHive.User miner
     * @param amount The amount of hashes to withdraw.
     * @param callback The callback
     */
    withdraw(name, amount, callback)
```

##user/top
```js
    /**
     * @description The method to get a list of top users ordered by total number of hashes, balance or hashes withdrawn
     * @param count The number of users to return. Default 128, min 1, max 1024.
     * @param order Either total, balance or withdrawn. The default is total
     * @param callback The callback
     */
    top(count, order, callback)
```

##user/list
```js
    /**
     * @description The method to get a paginated list of all users in alphabetical order
     * @param count The number of users to return. Default 4096, min 32, max 8192
     * @param page The page of users to return, obtained from the previous request's nextPage property
     * @param callback The callback
     */
    list(count, page, callback)
```

##user/reset
```js
    /**
     * @description The method to reset a user's total hashes and withdrawn amount to 0.
     * @param name The user's name whose total and withdrawn values will be reset to 0
     * @param callback The callback
     */
    reset(name, callback)
```

##user/reset-all
```js
    /**
     * @description The method to reset the hashes and withdrawn amount for all users for this site to 0
     * @param callback The callback
     */
    resetAll(callback)
```

##link/create
```js
    /**
     * @description The method to create a new shortlink
     * @param url The target URL for the shortlink
     * @param hashes The number of hashes that have to be solved, before the user is redirected to the target URL
     * @param callback The callback
     */
    create(url, hashes, callback)
```

##stats/payout
```js
    /**
     * @description The method to get the current payout rate and stats about the network
     * @param callback The callback
     */
    payout(callback)
```

##stats/site
```js
/**
     * @description The method to get the current hashrate, total hashes, paid & pending xmr, and the hourly history for the past seven days for the site
     * @param callback The callback
     */
    site(callback)
```

##stats/history
```js
    /**
     * @description The method to get the hourly history of total hashes and hashes/s for a time period for the site
     * @param begin Unix timestamp of the begin of the period you want to retrieve
     * @param end Unix timestamp of the end of the period you want to retrieve
     * @param callback The callback
     */
    history(begin, end, callback)
```


## Example

```js
    const CoinhiveAPI = require('coinhiveapi');

    let coinhivebapi = new CoinhiveAPI('azertyuiopqsdfghjklmwxcvbn');
    
    coinhivebapi.balance("johndoe",res => {
        if(res.total > 4068) {
            //Withdraw 4068 hashes
            coinhivebapi.withdraw('johndoe', 4068, res => {
                console.log(res);
            });
        }
    })
```

