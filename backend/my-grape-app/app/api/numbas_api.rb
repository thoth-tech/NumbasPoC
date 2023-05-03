require 'grape'
require 'zip'

class NumbasAPI < Grape::API
  format :json

  # Define the API namespace
  namespace :numbas_api do
    # Route for serving the index.html file from the ZIP archive
    get do
      # Set the path to the ZIP archive
      zip_path = File.join('public', 'assets', 'numbas1.zip')

      # Get an input stream for the index.html file within the ZIP archive
      index_html_stream = Zip::File.open(zip_path) do |zip_file|
        zip_file.get_input_stream('index.html')
      end

      # Set the content type for the response
      content_type 'text/html'

      # Stream the contents of the index.html file to the client
      stream do |out|
        out.write(index_html_stream.read(4096)) until index_html_stream.eof?
        index_html_stream.close
      end
    end

    # Route for serving files from the ZIP archive
    get '*file_path' do
      # Set the path to the ZIP archive
      zip_path = File.join('public', 'assets', 'numbas1.zip')

      # Set the path to the requested file within the ZIP archive
      file_path = params[:file_path]

      # Get an input stream for the requested file within the ZIP archive
      file_stream = Zip::File.open(zip_path) do |zip_file|
        zip_file.get_input_stream(file_path)
      end

      # Set the content type based on the file extension
      content_type MIME::Types.type_for(file_path).first.content_type

      # Stream the contents of the file to the client
      stream do |out|
        out.write(file_stream.read(4096)) until file_stream.eof?
        file_stream.close
      end
    end
  end
end
