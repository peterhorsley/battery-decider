# battery-decider
Uses Enphase Enlighten API to help decision around battery storage.

# How to use
Load decider.html in chrome, enter your Enlight API key, user id and system id, choose a date range and press Decide.

This app will will make 2 API calls, one to get production data and one to get consumption data intervals for the date range, then will do some simple logic to calculate the following:

- average daily production
- average daily consumption
- average daily net energy
- average daily energy exported to grid
- average daily energy imported from grid

The last two are the most useful in deciding on a battery size, based on the assumption that if (exported energy > size of battery < imported energy) holds true, then a battery makes sense, since the system will be able to charge it full and discharge it on average every day.
