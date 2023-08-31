class ChangeAttemptNumberDefaultsInSaveTests < ActiveRecord::Migration[6.0] # or your Rails version
  def change
    # Set a default value for attempt_number
    change_column_default :save_tests, :attempt_number, from: nil, to: 1

    # Ensure that attempt_number cannot be NULL
    change_column_null :save_tests, :attempt_number, false
  end
end
