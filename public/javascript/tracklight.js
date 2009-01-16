$(document).ready(function() {
  $("#queue,#icebox").sortable({
    connectWith: ["#queue", "#icebox"]
  });

  fetchTickets();
});


// Fetches all tickets starting with given page (by default, page 1).
function fetchTickets(page) {
  if (page == undefined) page = 1;
  
  getTicketsFromPage = arguments.callee
  
  $.getJSON("/tickets?page="+page, function(data) {
    // Add the tickets to the Icebox.
    $.each(data, function() {
      $("#icebox").append("<li>"+this.title+"</li>");
    });
    
    // Fetch more.
    if (data.length > 0) getTicketsFromPage(page+1);
  });
}
