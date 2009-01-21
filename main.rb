require 'rubygems'
require 'sinatra'
require 'lighthouse'

Lighthouse.account = 'dropio'
Lighthouse.token = '85d698469180f0c1b0bd9ba45a79b36b5f38e736'
PROJECT_ID = 4623 unless defined?(PROJECT_ID)
TICKET_LISTS_FILE = File.dirname(__FILE__) + "/data/ticket_order.yml" unless defined?(TICKET_LISTS_FILE)

helpers do
  def load_lists
    lists = YAML.load_file(TICKET_LISTS_FILE) rescue {}
    lists = {} unless lists.is_a? Hash
    lists
  end
  
  def write_lists(lists)
    File.open(TICKET_LISTS_FILE, 'w') do |file|
      file.write lists.to_yaml
    end
  end
  
  def write_list(name, list)
    write_lists load_lists.merge(name => list)
  end
  
  def ticket_url(ticket)
    "http://#{Lighthouse.account}.lighthouseapp.com/projects/#{PROJECT_ID}/tickets/#{ticket.id}-#{ticket.permalink}"
  end
end

get '/tickets' do
  page = params[:page] || 1
  tickets = Lighthouse::Ticket.find(:all, :params => { :project_id => PROJECT_ID, :q => "responsible:me", :page => page })
  tickets.map(&:id).to_json
end

get '/tickets/:id' do
  ticket = Lighthouse::Ticket.find(params[:id], :params => { :project_id => PROJECT_ID})
  { :id => ticket.id,
    :title => ticket.title,
    :url => ticket_url(ticket) }.to_json
end

get '/lists' do
  load_lists.to_json
end

post '/lists/:list' do
  write_list params[:list], [params["ticket[]"]].flatten.compact.map { |tid| tid.to_i }
end
