var Uphold = require("uphold-sdk-node")({
    pat:    process.env.UPHOLD_TOKEN
});
var fs = require("fs");

var sell = function(currencyCode, currentUserData) {
    console.log("selling " + currencyCode);
    var fromCard;
    currentUserData.cards.filter((c) => {
        if (c.currency == currencyCode) {
            fromCard = c;
        }
    });
    var toCard;
    var toCurrencyCode = currencyCode === "USD" ? "BTC": "USD";
    currentUserData.cards.filter((c) => {
        if (c.currency == toCurrencyCode) {
            toCard = c;
        }
    });
    Uphold.createTransaction({
        card        : fromCard.id,
        currency    : currencyCode,
        amount      : fromCard.balance,
        destination : toCard.id,
        message     : "bot transaction"
    }, (err, transaction) => {
        if (err) {
            console.log("UNABLE to sell " + currencyCode + ": " + err.message);
            return;
        }
        console.log("Sold " + currencyCode + ": " + JSON.stringify(transaction));
    });
};

var fish = function() {
    var lastUserData;
    const cachedFileName = "me.json";
    try {
        var last = fs.readFileSync(cachedFileName, {encoding:"utf8"});
        lastUserData = JSON.parse(last);
    }
    catch (e) {
        lastUserData = {};
    }


    Uphold.user(function(err, user) {
        if(err) {
            console.log("ERROR: " + JSON.stringify(err));
            return;
        }
        fs.writeFileSync(cachedFileName, JSON.stringify(user));
        var output = {
            currentTotal        : parseFloat(user.balances.total),
            initialTotal        : parseFloat(lastUserData.balances.total)
        };
        output.diffTotal = output.currentTotal - output.initialTotal;
        console.log(JSON.stringify(output));
        var currentCurrencies = user.balances.currencies;
        var oldCurrencies = lastUserData.balances.currencies;
        for(var currencyCode in currentCurrencies) {
            var currentData = currentCurrencies[currencyCode];
            var balance = parseFloat(currentData.balance);
            if (balance > 0) {
                console.log(currencyCode + ": " + balance);
                var currentRate = currencyCode === "USD" ? 1.0 / parseFloat(currentCurrencies["BTC"].rate) : parseFloat(currentData.rate);
                var oldRate = currencyCode === "USD" ? 1.0 / parseFloat(oldCurrencies["BTC"].rate) : parseFloat(oldCurrencies[currencyCode].rate);
                console.log("rate " + currentRate + " was " + oldRate);
                if (currentRate < oldRate) {
                    sell(currencyCode, user);
                }
            }
        }
    });
};

setInterval(fish, 3600000);
