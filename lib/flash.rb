class Flash
  def initialize(app)
    @app = app
  end

  def call(env)
    env["rack.session"][:flash] ||= FlashHash.new
    status, headers, body = @app.call(env)
    env["rack.session"][:flash].sweep
    
    [status, headers, body]
  end
  
  class FlashHash
    def initialize
      @values = {}
      @accessed_keys = []
    end

    # Set the value for a key.
    def []=(k, v)
      @values[k] = v
    end

    # Access a value, but remember to forget it before the next request.
    def [](k)
      unless @values[k].nil? or @accessed_keys.include?(k)
        @accessed_keys << k
      end
      @values[k]
    end

    # Clean out values that have been accessed.
    def sweep
      @accessed_keys.each { |k| @values.delete k }
      @accessed_keys = []
    end
  end  
end
