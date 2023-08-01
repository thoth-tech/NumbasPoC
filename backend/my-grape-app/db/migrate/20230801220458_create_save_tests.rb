class CreateSaveTests < ActiveRecord::Migration[6.0]
  def change
    create_table :save_tests do |t|
      t.string :name
      t.integer :attempt_number
      t.boolean :pass_status
      t.text :suspend_data

      t.timestamps
    end
  end
end
