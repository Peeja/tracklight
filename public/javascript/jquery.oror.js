(function($) {
  $.fn.oror = function(alternate) {
    if (this.length == 0) {
      if (typeof alternate === "function") {
        return alternate();
      } else {
        return $(alternate);
      };
    } else {
      return this;
    };
  };
})(jQuery)