$(document).ready(function() {
  // Creates and returns a new, unloaded ticket.  Call #update to load.
  function createTicket(id) {
    return $("#ticket_template").clone(true)
      .attr({id: "ticket_"+id, ticket_id: id})
      .fn({
        // If ticket_details is not given, details will be fetched.
        update: function(ticket_details) {
          var self = $(this);
          
          function updateWithDetails(ticket_details) {
            self.removeClass('loading');
            self.find(".title").text(ticket_details.title);
            self.find(".link").attr({href: ticket_details.url}).text('#'+ticket_details.id);
            self.find(".requester").text(ticket_details.requester);
            self.find(".responsible").text(ticket_details.responsible);
            self.find(".state").text(ticket_details.state);
            self.find(".description").text(ticket_details.description);
            self.find(".tags").text(ticket_details.tags);
          }
          
          if (ticket_details != undefined)
            updateWithDetails(ticket_details);
          else
            $.getJSON("/tickets/"+self.attr("ticket_id"), updateWithDetails);
          
          return self;
        }
      });
  }
  
  $(".list").sortable({
      appendTo: "#main",
      helper: "clone",
      connectWith: [".list"],
      cancel: ".disclosure",
      change: function(e, ui) {
        if (ui.placeholder.parent().is("#icebox")) {
          var id = ui.item.attr("id");
          ui.placeholder.insertAfter("#"+id+"_marker");
        }
      },
      update: function(e, ui) {
        $(this).not("#icebox").fn('save');
      }
  }).not("#icebox").fn({
    update: function(ticket_ids) {
      var self = $(this);
      // Moves and creates tickets to match the given list of ticket ids.
      // After update, the list has exactly those tickets whose ids are given,
      // and in the given order.
      function updateWithTicketIds(ticket_ids) {
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
      }
      
      if (ticket_ids != undefined)
        updateWithTicketIds(ticket_ids);
      else
        $.getJSON("/lists/"+self.attr("id"), updateWithTicketIds);
    },
    save: function() {
      var ticket_ids = $(this).sortable("serialize")
      $.post('/lists/'+$(this).attr('id'), ticket_ids);
    }
  });
  
  $("#icebox").fn({
    page: function(page_num) {
      if (page_num == undefined)
        return $(this).data("page_num") || 1;
      else
        $(this).data("page_num", page_num);
    },
    update: function() {
      var self = $(this);
      self.empty();
      $.getJSON("/tickets?page="+self.fn("page"), function(data) {
        // Add the tickets to the Icebox.
        $.each(data, function(i, ticket_details) {
          $("#icebox").append("<li class='ticket-marker' id='ticket_"+ticket_details.id+"_marker' />");
          $("#ticket_"+ticket_details.id).oror(function() {
            return createTicket(ticket_details.id).appendTo($("#icebox"));
          }).fn('update', ticket_details);
        });
      });
    }
  });
  
  $(".disclosure").click(function() {
    var shouldClose = $(this).hasClass("open");
    $(this).parent().find(".details").toggle(!shouldClose).end().end().toggleClass("open", !shouldClose);
  });
  
  $(".list").fn("update");
});
