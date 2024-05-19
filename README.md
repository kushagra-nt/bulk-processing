# overview

I have used kafka for scalable processing of large csv, so when we get a csv with many records, it breaks it in chunks of 500 records and produces different messages to be consumed by different consumers which can process all the records parallely, and used promise.all in that too for better processing, and used a separate mongo collection which keeps track of every file upload process, status of every upload can be tracked using that.

# endpoints

1)  POST: `${base_url}/user-list/create`
 create a userList, 

		```
		body: {
			name: string (required),
			description: string (optional),
			customProperties: {
					name: default_value,
					engine: v8,
					country: india
			}
		}
		 ```


you will get a userListId in return, keep it safe,

2) POST:  `${base_url}/user-list/${userListId}/add-bulk-users`
```
form data: 
"csv-file": your_csv_file
```
processing will start n background using kafka, you will get a process id to track your progress,

3) GET: `${base_url}/user-list/csv-status/${processId}`
you will get all the info related to your process

