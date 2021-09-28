module.exports = {
   formatIndex: (index) => {
      return index + 1;
   },
   ifCond: (v1, v2, options) => {
      if (v1 == v2) {
         return options.fn(this);
      } else {
         return options.inverse(this);
      }
   },
};