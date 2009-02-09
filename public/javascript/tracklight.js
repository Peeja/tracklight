$(document).ready(function() {
  // Creates and returns a new ticket.  If details are
  // missing, they are loaded via AJAX.
  function createTicket(id, details) {
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
            
            var initials = ticket_details.responsible_initials ?
                             "("+ticket_details.responsible_initials+")" : ""
            self.find(".responsible_initials").text(initials);
          }
          
          if (ticket_details != undefined)
            updateWithDetails(ticket_details);
          else
            $.getJSON("/tickets/"+self.attr("ticket_id"), updateWithDetails);
          
          return self;
        }
      }).fn('update', details);
  }
  
  $(".list").sortable({
      appendTo: "#main",
      helper: "clone",
      connectWith: [".list"],
      cancel: ".disclosure",
      change: function(e, ui) {
        if (ui.placeholder.parent().is("#icebox")) {
          var id = ui.item.attr("id");
          var marker = $("#"+id+"_marker");
          
          if (marker.length > 0)
            ui.placeholder.insertAfter(marker);
          else {
            ui.placeholder.appendTo("<div></div>");
          }
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
  
  var iceboxPageRequest = null;
  
  $("#icebox").fn({
    update: function() {
      var self = $(this);
      var page = self.fn("page");
      $("#page_num").text(page);
      
      if (iceboxPageRequest) iceboxPageRequest.abort();
      
      iceboxPageRequest = $.getJSON("/tickets?page="+page, function(data) {
        self.empty();
        
        // Add the tickets to the Icebox.
        $.each(data, function(i, ticket_details) {
          $("#icebox").append("<li class='ticket-marker' id='ticket_"+ticket_details.id+"_marker' />");
          $("#ticket_"+ticket_details.id).oror(function() {
            return createTicket(ticket_details.id, ticket_details).appendTo($("#icebox"));
          });
        });
      });
    },
    page: function(page_num) {
      if (page_num == undefined)
        return $(this).data("page_num") || 1;
      else
        $(this).data("page_num", page_num).fn('update');
    },
  });
  
  $("#previous_page").click(function() { $("#icebox").fn('page', $("#icebox").fn('page')-1); });
  $("#next_page").click(function()     { $("#icebox").fn('page', $("#icebox").fn('page')+1); });
  
  $(".disclosure").click(function() {
    $(this).parent().toggleClass("closed");
  });
  
  $(".list").fn('update');
});
