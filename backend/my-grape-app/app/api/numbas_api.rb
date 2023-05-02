require 'grape'
require 'zip'

require 'fileutils'
require 'mime-types'

class NumbasAPI < Grape::API
  format :json

  helpers do
    # Helper function to extract a ZIP file to the specified destination
    def extract_zip(file, destination)
      Zip::File.open(file) do |zip_file|
        zip_file.each do |entry|
          entry.extract(File.join(destination, entry.name))
        end
      end
    end
  end

  # Define the API namespace
  namespace :zip do
    # Route for serving the index.html file
    get 'index.html' do
      # Set the location of the ZIP file and the destination to extract it
      zip_path = 'public/numbas.zip'
      extracted_folder = 'public/extracted/numbas'

      # Create the destination folder if it doesn't exist
      FileUtils.mkdir_p(extracted_folder)

      # Extract the ZIP file
      extract_zip(zip_path, extracted_folder)

      # Redirect to the index.html file within the extracted folder
      redirect '/extracted/numbas/index.html'
    end

    # Route for serving any other file within the extracted folder
    get '*path' do
      # Set the file path within the extracted folder
      file_path = "public/extracted/numbas/#{params[:path]}"

      # Return an error if the file doesn't exist
      error!('File not found', 404) unless File.exist?(file_path)

      # Set the content type based on the file extension
      content_type = MIME::Types.type_for(file_path).first.content_type
      header 'Content-Type', content_type

      # Serve the file
      File.read(file_path)
    end
  end
end
