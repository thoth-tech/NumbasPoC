require 'grape'
require 'zip'
require 'mime/types'

class NumbasAPI < Grape::API
  # Helper methods for the API
  helpers do
    # Method to stream a file from a zip archive at the specified path
    # @param zip_path [String] the path to the zip archive
    # @param file_path [String] the path of the file within the zip archive
    def stream_file_from_zip(zip_path, file_path)
      file_stream = nil
    
      # Get an input stream for the requested file within the ZIP archive
      Zip::File.open(zip_path) do |zip_file|
        zip_file.each do |entry|
          # Print the entry name in the console
          puts "Entry name: #{entry.name}"
          
          if entry.name == file_path
            file_stream = entry.get_input_stream
            break
          end
        end
      end
    
      # If the file was not found in the ZIP archive, return a 404 response
      unless file_stream
        error!({ error: 'File not found' }, 404)
      end
    
      # Set the content type based on the file extension
      content_type = MIME::Types.type_for(file_path).first.content_type
      puts "Content type: #{content_type}"
    
      # Set the content type header
      header 'Content-Type', content_type
    
      # Set cache control header to prevent caching
      header 'Cache-Control', 'no-cache, no-store, must-revalidate'
    
      # Set the body to the contents of the file_stream and return the response
      body file_stream.read
    end
    
  end

  # Define the API namespace
  namespace :numbas_api do
    # Route for serving the index.html file from the ZIP archive
    get '/index.html' do
      env['api.format'] = :txt
      # Set the path to the ZIP archive
      zip_path = File.join('public', 'assets', 'numbas1.zip')

      puts "Serving index.html from #{zip_path}"

      # Stream the index.html file from the zip archive
      stream_file_from_zip(zip_path, 'index.html')
    end
    get '*file_path' do
      env['api.format'] = :txt
      # Set the path to the ZIP archive
      zip_path = File.join('public', 'assets', 'numbas1.zip')
      
      # Prepend "numbas_api/" to the requested file path
      requested_file_path = "#{params[:file_path]}.#{params[:format]}"
      
      puts "Serving file from #{zip_path} at path #{requested_file_path}"
      
      # Stream the requested file from the zip archive
      stream_file_from_zip(zip_path, requested_file_path)
    end
    
       
  end
end
