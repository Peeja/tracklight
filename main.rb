require 'rubygems'
require 'sinatra'
require 'lighthouse'

configure do
  Sinatra::Default.set :ticket_lists_file, "data/ticket_order.yml"
  
  load File.dirname(__FILE__) + "/config/environment.rb"
  
  # Required options
  [:account, :token, :project_id].each do |option|
    Sinatra::Application.send(option) rescue raise("Required option not set: #{option}")
  end
  
  Lighthouse.account = Sinatra::Application.account
  Lighthouse.token = Sinatra::Application.token
end

helpers do
  def load_lists
    lists = YAML.load_file(options.ticket_lists_file) rescue {}
    lists = {} unless lists.is_a? Hash
    lists
  end
  
  def write_lists(lists)
    File.open(options.ticket_lists_file, 'w') do |file|
      file.write lists.to_yaml
    end
  end
  
  def write_list(name, list)
    write_lists load_lists.merge(name => list)
  end
  
  def ticket_url(ticket)
    "http://#{options.account}.lighthouseapp.com/projects/#{options.project_id}/tickets/#{ticket.id}-#{ticket.permalink}"
  end
  
  def ticket_details(ticket)
    { :id => ticket.id,
      :title => ticket.title,
      :url => ticket_url(ticket) }
  end
end

get '/tickets' do
  page = params[:page] || 1
  tickets = Lighthouse::Ticket.find(:all, :params => { :project_id => options.project_id, :q => "responsible:me", :page => page })
  tickets.map {|t| ticket_details(t) }.to_json
end

get '/tickets/:id' do
  ticket_details(Lighthouse::Ticket.find(params[:id], :params => { :project_id => options.project_id})).to_json
end

get '/lists' do
  load_lists.to_json
end

post '/lists/:list' do
  write_list params[:list], [params["ticket[]"]].flatten.compact.map { |tid| tid.to_i }
end
