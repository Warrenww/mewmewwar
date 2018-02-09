// For official API documentation: https://coinhive.com/documentation/http-api

"use strict";
const request = require('request'),
    querystring = require('querystring');

class CoinhiveAPI {

    /**
     *
     * @param secret_key Coinhive Secret Key
     */
    constructor (secret_key) {
        this.secret_key = secret_key;
    }

    /**
     * @description The method to send requests
     * @param method The method to send request
     * @param post Is a HTTP Post Request
     * @param data The data to be sent
     * @param callback The callback
     */
     static APIRequest(method, post, data, callback) {
        let req = {
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: 'https://api.coinhive.com/' + method
        };

        if(!post) {
            req.url += '?' + querystring.stringify(data);
        } else {
            req.form = data;
        }

        request.post(req, function(error, response, body){
            if(error) callback({status: 504, message:'Connection error'});
            else callback(body);
        });
     }

    /**
     * @description The method to verify that a token from a CoinHive.Token miner has reached a number of hashes
     * @param token The name of the token you want to verify
     * @param hashes The number of hashes this token must have reached in order to be vali
     * @param callback The callback
     */
    verify(token, hashes, callback) {
        CoinhiveAPI.APIRequest('token/verify', true, {
            secret: this.secret_key,
            token: token,
            hashes: hashes
        }, callback);
    }

    /**
     * @description The method to get the total number of hashes, the withdrawn hashes and the current balance for a user name
     * @param name The user's name, analogous to the name specified for the CoinHive.User miner
     * @param callback The callback
     */
    balance(name, callback) {
        CoinhiveAPI.APIRequest('user/balance', false, {
            secret: this.secret_key,
            name: name
        }, callback);
    }

    /**
     * @description The method to withdraw a number of hashes for a user name
     * @param name The user's name, analogous to the name specified for the CoinHive.User miner
     * @param amount The amount of hashes to withdraw.
     * @param callback The callback
     */
    withdraw(name, amount, callback) {
        CoinhiveAPI.APIRequest('user/withdraw', true, {
            secret: this.secret_key,
            name: name,
            amount: amount
        }, callback);
    }

    /**
     * @description The method to get a list of top users ordered by total number of hashes, balance or hashes withdrawn
     * @param count The number of users to return. Default 128, min 1, max 1024.
     * @param order Either total, balance or withdrawn. The default is total
     * @param callback The callback
     */
    top(count, order, callback) {
        CoinhiveAPI.APIRequest('user/top', false, {
            secret: this.secret_key,
            count: count,
            order: order
        }, callback);
    }

    /**
     * @description The method to get a paginated list of all users in alphabetical order
     * @param count The number of users to return. Default 4096, min 32, max 8192
     * @param page The page of users to return, obtained from the previous request's nextPage property
     * @param callback The callback
     */
    list(count, page, callback) {
        CoinhiveAPI.APIRequest('user/list', false, {
            secret: this.secret_key,
            count: count,
            page: page
        }, callback);
    }

    /**
     * @description The method to reset a user's total hashes and withdrawn amount to 0.
     * @param name The user's name whose total and withdrawn values will be reset to 0
     * @param callback The callback
     */
    reset(name, callback) {
        CoinhiveAPI.APIRequest('user/reset', true, {
            secret: this.secret_key,
            name: name
        }, callback);
    }

    /**
     * @description The method to reset the hashes and withdrawn amount for all users for this site to 0
     * @param callback The callback
     */
    resetAll(callback) {
        CoinhiveAPI.APIRequest('user/reset-all', true, {
            secret: this.secret_key
        }, callback);
    }

    /**
     * @description The method to create a new shortlink
     * @param url The target URL for the shortlink
     * @param hashes The number of hashes that have to be solved, before the user is redirected to the target URL
     * @param callback The callback
     */
    create(url, hashes, callback) {
        CoinhiveAPI.APIRequest('link/create', true, {
            secret: this.secret_key,
            url: url,
            hashes: hashes
        }, callback);
    }

    /**
     * @description The method to get the current payout rate and stats about the network
     * @param callback The callback
     */
    payout(callback) {
        CoinhiveAPI.APIRequest('stats/payout', false, {
            secret: this.secret_key
        }, callback);
    }

    /**
     * @description The method to get the current hashrate, total hashes, paid & pending xmr, and the hourly history for the past seven days for the site
     * @param callback The callback
     */
    site(callback) {
        CoinhiveAPI.APIRequest('stats/site', false, {
            secret: this.secret_key
        }, callback);
    }

    /**
     * @param begin Unix timestamp of the begin of the period you want to retrieve
     * @param end Unix timestamp of the end of the period you want to retrieve
     * @param callback The callback
     */
    history(begin, end, callback) {
        CoinhiveAPI.APIRequest('stats/history', false, {
            secret: this.secret_key,
            begin: begin,
            end: end
        }, callback);
    }


}

module.exports = CoinhiveAPI;
