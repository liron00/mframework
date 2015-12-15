/*
  Props:
    onStartUpload: ({file}) => void
    onUploaded: ({s3Key}) => void
*/

view S3Uploader {
  const prop = initProp(view, {
    accept: atom(),
    children: atom()
  })

  const uploading = atom(false)

  const handleFile = (e) => {
    const file = e.target.files[0]
    let s3Key

    uploading.set(true)

    M.apiPost('signS3Upload', {
      params: {
        fileType: file.type
      }
    }).then(apiResponse => {
      s3Key = apiResponse.s3Key
      const s3Url = `${M.config.s3UrlPrefix}${s3Key}`

      return fetch(apiResponse.signedRequest, {
        method: 'put',
        headers: {
          'x-amz-acl': 'public-read'
        },
        body: file
      })

    }, err => {
      uploading.set(false)
      console.error("Error signing S3 upload:", err)
      M.util.alertError(err)

    }).then(s3Response => {
      uploading.set(false)

      if (view.props.onUploaded) {
        view.props.onUploaded({s3Key})
      }

    }, err => {
      uploading.set(false)
      console.error("Error uploading to S3:", err)
    })

    if (view.props.onStartUpload) {
      view.props.onStartUpload({file})
    }
  }

  <notUploading if={!uploading.get()}>
    <Uploader accept={prop.accept.get()} onChange={handleFile}>
      {prop.children.get()}
    </Uploader>
  </notUploading>
  <uploading if={uploading.get()}>
    {prop.children.get()}
  </uploading>
}
