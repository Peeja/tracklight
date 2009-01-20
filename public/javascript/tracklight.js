$(document).ready(function() {
  // Fetches all tickets starting with given page (by default, page 1).
  function fetchUnknownTickets(page) {
    if (page == undefined) page = 1;
  
    getTicketsFromPage = arguments.callee
  
    $.getJSON("/tickets?page="+page, function(data) {
      // Add the tickets to the Icebox.
      $.each(data, function(i, id) {
        $("#ticket_"+id).oror(function() {
          $("#icebox").append(createTicket(id));
        });
      });
  
      // Fetch more.
      if (data.length > 0) getTicketsFromPage(page+1);
    });
  }
  
  // IMPLEMENT:
  function createTicket(id) {
    // return $("<li>Loading...</li>").attr({id: "ticket_"+id, class: 'ticket loading'});
    return $("<li>#"+id+"</li>").attr({id: "ticket_"+id, class: 'ticket'});
  }
  
  $(".list").fn({
    // Moves and creates tickets to match the given list of ticket ids.
    // After update, the list has exactly those tickets whose ids are given,
    // and in the given order.
    update: function(ticket_ids) {
      self = this;
      $.each(ticket_ids, function(i, id) {
        // Find or create ticket by id.
        ticket = $("#ticket_"+id).oror(function() {
          return createTicket(id);
        });
        
        // Insert in the correct place.
        if (i == 0) { ticket.prependTo(self); }
        else        { ticket.insertAfter($(self).find(".ticket:eq("+(i-1)+")")[0]); }
      });
      // Remove any extra tickets.
      $(self).find(".ticket:gt("+(ticket_ids.length-1)+")").remove();
    },
    save: function() {
      ticket_ids = $(this).sortable("serialize")
      $.post('/lists/'+$(this).attr('id'), ticket_ids);
    }
  }).sortable({
      connectWith: [".list"],
      update: function(e, ui) {
        $(this).fn('save');
      }
  });
  
  // Fetch lists
  $.getJSON("/lists", function(lists) {
    // Fetch tickets for lists
    $.each(lists, function(list, ticket_ids) {
      $("#"+list).fn('update', ticket_ids);
    })
  })
  
  // Fetch all tickets and add extras to Icebox
  fetchUnknownTickets();
});
