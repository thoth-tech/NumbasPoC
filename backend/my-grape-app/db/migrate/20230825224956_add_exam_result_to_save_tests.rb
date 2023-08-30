class AddExamResultToSaveTests < ActiveRecord::Migration[7.0]
  def change
    add_column :save_tests, :exam_result, :string
  end
end
