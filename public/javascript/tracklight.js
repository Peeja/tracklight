$(document).ready(function() {
  // Fetches all tickets, page by page.  Updates tickets already
  // in the DOM and adds new tickets to the Icebox.
  function fetchTickets(page) {
    function fetchTicketsFromPage(page) {
      $.getJSON("/tickets?page="+page, function(data) {
        // Add the tickets to the Icebox.
        $.each(data, function(i, ticket_details) {
          $("#ticket_"+ticket_details.id).oror(function() {
            return createTicket(ticket_details.id).appendTo($("#icebox"));
          }).fn('update', ticket_details);
        });

        // Fetch more.
        if (data.length > 0) fetchTicketsFromPage(page+1);
      });
    }
    
    fetchTicketsFromPage(1);
  }
  
  // Creates and returns a new, unloaded ticket.  Call #update to load.
  function createTicket(id) {
    var template = "<li><span class='title'>Loading...</span> <a class='link' href='#'>link</a></li>"
    return $(template)
      .attr({id: "ticket_"+id, ticket_id: id, class: 'ticket loading'})
      .fn({
        // If ticket_details is not given, details will be fetched.
        update: function(ticket_details) {
          var self = $(this);
          
          function updateWithDetails(ticket_details) {
            self.removeClass('loading');
            self.find(".title").text(ticket_details.title);
            self.find(".link").attr({href: ticket_details.url});
          }
          
          if (ticket_details != undefined)
            updateWithDetails(ticket_details);
          else
            $.getJSON("/tickets/"+self.attr("ticket_id"), updateWithDetails);
          
          return self;
        }
      });
  }
  
  $(".list").fn({
    // Moves and creates tickets to match the given list of ticket ids.
    // After update, the list has exactly those tickets whose ids are given,
    // and in the given order.
    update: function(ticket_ids) {
      var self = $(this);
      $.each(ticket_ids, function(i, id) {
        // Find or create ticket by id.
        var ticket = $("#ticket_"+id).oror(function() {
          return createTicket(id);
        });
        
        // Insert in the correct place.
        if (i == 0) { ticket.prependTo(self); }
        else        { ticket.insertAfter(self.find(".ticket:eq("+(i-1)+")")[0]); }
      });
      // Remove any extra tickets.
      self.find(".ticket:gt("+(ticket_ids.length-1)+")").remove();
    },
    save: function() {
      var ticket_ids = $(this).sortable("serialize")
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
  fetchTickets();
});
